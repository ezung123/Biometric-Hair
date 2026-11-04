// ══════════════════════════════════════════════════════════════════════════════
// src/stylist/translation.ts
// MULTILINGUAL BARBER BRIEF TRANSLATION (EN, ES, ZH, FR)
// Powered by Muse Spark Open with Static i18n Dictionary Fallback & Label Preservation
// ══════════════════════════════════════════════════════════════════════════════

import type { BarberBrief } from './tools.ts';

export type SupportedLanguage = 'EN' | 'ES' | 'ZH' | 'FR';

export interface TranslatedBriefLabels {
  title: string;
  subtitle: string;
  topZone: string;
  sidesZone: string;
  backZone: string;
  fringeZone: string;
  clipperGuards: string;
  scissorNotes: string;
  finishing: string;
  maintenanceTitle: string;
  trimInterval: string;
  stylingTime: string;
  productsTitle: string;
  askScriptTitle: string;
  avoidListTitle: string;
  copyBtn: string;
  copiedBtn: string;
  downloadPdfBtn: string;
  shareBtn: string;
  disclosure: string;
}

export const I18N_DICTIONARY: Record<SupportedLanguage, TranslatedBriefLabels> = {
  EN: {
    title: 'BARBER CONSULTATION BRIEF',
    subtitle: 'Anatomically Grounded Cutting Specification',
    topZone: 'TOP / CROWN ZONE',
    sidesZone: 'PARIETAL / SIDES ZONE',
    backZone: 'OCCIPITAL / NAPE ZONE',
    fringeZone: 'FRONTAL / FRINGE ZONE',
    clipperGuards: 'CLIPPER GUARDS',
    scissorNotes: 'SCISSOR DIRECTIVES',
    finishing: 'FINISHING & REGIMEN',
    maintenanceTitle: 'MAINTENANCE & UPKEEP',
    trimInterval: 'Trim Interval',
    stylingTime: 'Daily Styling Prep',
    productsTitle: 'RECOMMENDED PRODUCTS',
    askScriptTitle: 'WHAT TO SAY IN THE BARBER CHAIR',
    avoidListTitle: 'CRITICAL DIRECTIVES: WHAT TO AVOID',
    copyBtn: 'COPY TEXT BRIEF',
    copiedBtn: 'COPIED TO CLIPBOARD!',
    downloadPdfBtn: 'DOWNLOAD PDF',
    shareBtn: 'SHARE BRIEF',
    disclosure: 'Clinically calibrated anthropometric specification · Biometric Hair Arch',
  },
  ES: {
    title: 'INFORME DE CONSULTA PARA BARBERÍA',
    subtitle: 'Especificación de Corte Basada en Anatomía Cephalométrica',
    topZone: 'ZONA SUPERIOR / CORONILLA',
    sidesZone: 'ZONA PARIETAL / LATERALES',
    backZone: 'ZONA OCCIPITAL / NUCA',
    fringeZone: 'ZONA FRONTAL / FLEQUILLO',
    clipperGuards: 'GUÍAS DE MÁQUINA (CLIPPERS)',
    scissorNotes: 'DIRECTIVAS DE TIJERA',
    finishing: 'ACABADO Y PEINADO',
    maintenanceTitle: 'MANTENIMIENTO Y CUIDADO',
    trimInterval: 'Frecuencia de Corte',
    stylingTime: 'Tiempo Diario de Peinado',
    productsTitle: 'PRODUCTOS RECOMENDADOS',
    askScriptTitle: 'QUÉ DECIR EN EL SILLÓN DE LA BARBERÍA',
    avoidListTitle: 'DIRECTIVAS CRÍTICAS: QUÉ EVITAR',
    copyBtn: 'COPIAR TEXTO',
    copiedBtn: '¡COPIADO AL PORTAPAPELES!',
    downloadPdfBtn: 'DESCARGAR PDF',
    shareBtn: 'COMPARTIR',
    disclosure: 'Especificación antropométrica calibrada · Biometric Hair Arch (Traducido por máquina)',
  },
  ZH: {
    title: '理发师咨询专业规范单',
    subtitle: '基于颅面解剖测量的发型剪裁指南',
    topZone: '顶部 / 头顶区',
    sidesZone: '两侧 / 鬓角区',
    backZone: '后枕部 / 颈部区',
    fringeZone: '前额 / 刘海区',
    clipperGuards: '电推剪卡尺规格',
    scissorNotes: '剪刀剪裁角度指导',
    finishing: '造型修整与定型',
    maintenanceTitle: '维护与打理周期',
    trimInterval: '修剪周期',
    stylingTime: '每日打理耗时',
    productsTitle: '推荐造型产品',
    askScriptTitle: '理发时如何向理发师沟通',
    avoidListTitle: '关键避坑要点：切勿执行',
    copyBtn: '复制文本指南',
    copiedBtn: '已复制到剪贴板！',
    downloadPdfBtn: '下载 PDF',
    shareBtn: '分享指南',
    disclosure: '严格依据面部测量参数生成 · Biometric Hair Arch（机器翻译）',
  },
  FR: {
    title: 'FICHE TECHNIQUE POUR LE COIFFEUR',
    subtitle: 'Spécification de Coupe Basée sur l’Anatomie Crânienne',
    topZone: 'ZONE DU SOMMET / COURONNE',
    sidesZone: 'ZONE PARIÉTALE / CÔTÉS',
    backZone: 'ZONE OCCIPITALE / NUQUE',
    fringeZone: 'ZONE FRONTALE / FRANGE',
    clipperGuards: 'SABOTS DE TONDEUSE',
    scissorNotes: 'DIRECTIVES AUX CISEAUX',
    finishing: 'FINITION ET COIFFAGE',
    maintenanceTitle: 'ENTRETIEN ET FRÉQUENCE',
    trimInterval: 'Fréquence de Coupe',
    stylingTime: 'Temps de Coiffage Quotidien',
    productsTitle: 'PRODUITS RECOMMANDÉS',
    askScriptTitle: 'CE QU’IL FAUT DIRE DANS LE FAUTEUIL',
    avoidListTitle: 'DIRECTIVES CRITIQUES : CE QU’IL FAUT ÉVITER',
    copyBtn: 'COPIER LE TEXTE',
    copiedBtn: 'COPIÉ DANS LE PRESSE-PAPIERS !',
    downloadPdfBtn: 'TÉLÉCHARGER LE PDF',
    shareBtn: 'PARTAGER',
    disclosure: 'Spécification anthropométrique calibrée · Biometric Hair Arch (Traduction automatique)',
  },
};

const translationCache = new Map<string, { askScript: string[]; avoidList: string[] }>();

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
 * Translates dynamic brief sentences using Muse Spark Open via Proxy,
 * while keeping numbers, units (cm), and clipper guard numbers strictly preserved.
 */
export async function translateBriefContent(
  brief: BarberBrief,
  lang: SupportedLanguage
): Promise<{ askScript: string[]; avoidList: string[]; isMachineTranslated: boolean }> {
  if (lang === 'EN') {
    return {
      askScript: brief.askScript,
      avoidList: brief.avoidList,
      isMachineTranslated: false,
    };
  }

  const cacheKey = `${brief.styleId}_${lang}`;
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)!;
    return {
      askScript: cached.askScript,
      avoidList: cached.avoidList,
      isMachineTranslated: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const proxyUrl = `${getProxyBaseUrl()}/api/baseten/chat`;
    const prompt = `Translate the following haircut consultation points into ${
      lang === 'ES' ? 'Spanish' : lang === 'ZH' ? 'Simplified Chinese' : 'French'
    }.
PRESERVE ALL NUMBERS, UNITS (cm), AND CLIPPER GUARDS (e.g. #1, #2) EXACTLY AS IS.
Return valid JSON matching: {"askScript": string[], "avoidList": string[]}

Input:
${JSON.stringify({ askScript: brief.askScript, avoidList: brief.avoidList })}`;

    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Token': 'biometric-hair-token-v1',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a professional multilingual salon translator. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const content = data?.data?.choices?.[0]?.message?.content || '';
      const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);

      if (Array.isArray(parsed.askScript) && Array.isArray(parsed.avoidList)) {
        translationCache.set(cacheKey, {
          askScript: parsed.askScript,
          avoidList: parsed.avoidList,
        });
        return {
          askScript: parsed.askScript,
          avoidList: parsed.avoidList,
          isMachineTranslated: true,
        };
      }
    }
  } catch (err) {
    // Graceful fallback to English with localized dictionary headers
  }

  return {
    askScript: brief.askScript,
    avoidList: brief.avoidList,
    isMachineTranslated: false,
  };
}

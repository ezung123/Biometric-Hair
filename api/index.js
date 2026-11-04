// ══════════════════════════════════════════════════════════════════════════════
// api/index.js
// VERCEL SERVERLESS FUNCTION HANDLER
// Routes API requests for Biometric Hair Arch when deployed on Vercel
// ══════════════════════════════════════════════════════════════════════════════

const BASETEN_API_KEY = process.env.BASETEN_API_KEY || '';
const BASETEN_BASE_URL = process.env.BASETEN_BASE_URL || 'https://inference.baseten.co/v1';
const BASETEN_MODEL = process.env.BASETEN_MODEL_ID || 'meta-models/muse-spark-open-1026';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Token, X-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'biometric-hair.vercel.app'}`);
  const pathname = url.pathname;

  // 1. Health check: /api/health
  if (pathname === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      platform: 'Vercel Serverless Edge',
      models: {
        museSparkOpen: {
          id: BASETEN_MODEL,
          configured: Boolean(BASETEN_API_KEY),
          provider: 'Baseten (Meta open-weights grant)',
          capabilities: ['reasoning', 'vision', 'json_cephalometric', 'concierge', 'translation'],
        },
      },
    });
  }

  // 2. Token usage / status: /api/baseten/usage
  if (pathname === '/api/baseten/usage') {
    return res.status(200).json({
      status: 'ok',
      configured: Boolean(BASETEN_API_KEY),
      model: BASETEN_MODEL,
      platform: 'Vercel Serverless',
    });
  }

  // Helper to parse JSON body if req.body is string
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // 3. Styling Prescription: /api/baseten/prescription
  if (pathname === '/api/baseten/prescription') {
    const metrics = body.metrics;
    if (!metrics || !metrics.verticalThirds) {
      return res.status(400).json({ success: false, error: 'Missing required metrics payload' });
    }

    const defaultCrown =
      metrics.verticalThirds.upperThirdPct > 36
        ? 'low'
        : metrics.verticalThirds.upperThirdPct < 30
        ? 'high'
        : 'neutral';
    const defaultSides = metrics.facialIndex < 80 ? 'faded' : 'tapered';
    const defaultFringe = metrics.verticalThirds.upperThirdPct > 35 ? 'full_bangs' : 'swept';

    // If Baseten Key is present, call Meta Muse Spark Open
    if (BASETEN_API_KEY) {
      const prompt = `Client Neoclassical Facial Anthropometrics:
- Morphology: ${metrics.faceShape}
- Facial Index: ${(metrics.facialIndex / 100).toFixed(2)} (Canonical: 1.35)
- Neoclassical Vertical Thirds: Forehead=${metrics.verticalThirds.upperThirdPct}%, Mid-Face=${metrics.verticalThirds.midThirdPct}%, Jaw/Chin=${metrics.verticalThirds.lowerThirdPct}% (Canonical target: 33.3% each)
- Audience Preference: ${body.audience || 'unisex'}
- Detected Current Texture: ${body.detectedCurrentHair || 'natural wave'}

Recommend volumetric haircut compensation and return strictly valid JSON matching:
{"crown": "high"|"neutral"|"low", "sides": "tapered"|"full"|"faded", "fringe": "full_bangs"|"curtain"|"swept"|"exposed", "rationale": string, "cautions": string}

STRICT RULE: Rationale must be at most 2 sentences citing ONLY the exact measurements provided above. Do not hallucinate numbers.`;

      const t0 = Date.now();
      try {
        const upstreamRes = await fetch(`${BASETEN_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${BASETEN_API_KEY}`,
          },
          body: JSON.stringify({
            model: BASETEN_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are an aesthetic biometric anthropometrist and master stylist. Output valid JSON only.',
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 1200,
            temperature: 0,
          }),
        });

        const upstreamData = await upstreamRes.json().catch(() => null);
        const latencyMs = Date.now() - t0;

        if (upstreamRes.ok && upstreamData?.choices?.[0]?.message?.content) {
          let parsed = null;
          try {
            const content = upstreamData.choices[0].message.content.trim();
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleanJson);
          } catch {}

          return res.status(200).json({
            success: true,
            source: parsed ? 'live_muse_spark_open' : 'offline_anthropometrics',
            model: BASETEN_MODEL,
            prescription: {
              volumeProfile: {
                crown: parsed?.crown || defaultCrown,
                lateralSides: parsed?.sides || defaultSides,
                foreheadCoverage: parsed?.fringe || defaultFringe,
              },
              rationalization:
                parsed?.rationale ||
                `Cephalometric proportions measured for ${metrics.faceShape} face (${metrics.facialIndex.toFixed(1)} index, ${metrics.verticalThirds.upperThirdPct}% upper third); balanced with ${defaultCrown} crown and ${defaultSides} profile.`,
              cautions:
                parsed?.cautions ||
                'Maintain regular taper and scissor intervals to preserve harmonious neoclassical balance.',
            },
            usage: upstreamData.usage || null,
            latencyMs,
          });
        }
      } catch (err) {
        // Fall through to deterministic response
      }
    }

    // Deterministic fallback if offline or no key
    return res.status(200).json({
      success: true,
      source: 'offline_anthropometrics',
      model: 'Deterministic Cephalometric Engine',
      prescription: {
        volumeProfile: {
          crown: defaultCrown,
          lateralSides: defaultSides,
          foreheadCoverage: defaultFringe,
        },
        rationalization: `Cephalometric proportions measured for ${metrics.faceShape} face (${metrics.facialIndex.toFixed(1)} index, ${metrics.verticalThirds.upperThirdPct}% upper third); balanced with ${defaultCrown} crown and ${defaultSides} profile.`,
        cautions: 'Maintain regular taper and scissor intervals to preserve harmonious neoclassical balance.',
      },
    });
  }

  // 4. Salon Concierge: /api/baseten/concierge
  if (pathname === '/api/baseten/concierge') {
    const userMessage = body.message || 'Hello';
    const metrics = body.metrics;

    if (BASETEN_API_KEY) {
      try {
        const upstreamRes = await fetch(`${BASETEN_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${BASETEN_API_KEY}`,
          },
          body: JSON.stringify({
            model: BASETEN_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an elite biometric salon concierge for Biometric Hair Arch. User face morphology: ${metrics?.faceShape || 'balanced'}. Provide concise, professional advice.`,
              },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 350,
          }),
        });

        const data = await upstreamRes.json().catch(() => null);
        if (data?.choices?.[0]?.message?.content) {
          return res.status(200).json({
            success: true,
            source: 'live_muse_spark_open',
            reply: data.choices[0].message.content.trim(),
            model: BASETEN_MODEL,
          });
        }
      } catch {}
    }

    return res.status(200).json({
      success: true,
      source: 'fallback_local',
      reply: `For your ${metrics?.faceShape || 'detected'} morphology, focus on maintaining structural volume balance at the crown while keeping clean tapers along the parietals.`,
      model: 'Local Salon Rules',
    });
  }

  // Fallback for unmatched routes
  return res.status(404).json({ error: `Not found: ${pathname}` });
}


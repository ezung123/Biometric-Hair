const BASETEN_API_KEY = process.env.BASETEN_API_KEY || '';
const BASETEN_BASE_URL = process.env.BASETEN_BASE_URL || 'https://inference.baseten.co/v1';
const BASETEN_MODEL = process.env.BASETEN_MODEL_ID || 'meta-models/muse-spark-open-1026';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Token');

  if (req.method === 'OPTIONS') return res.status(204).end();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};
  const metrics = body.metrics;
  if (!metrics || !metrics.verticalThirds) {
    return res.status(400).json({ success: false, error: 'Missing metrics payload' });
  }

  const defaultCrown =
    metrics.verticalThirds.upperThirdPct > 36
      ? 'low'
      : metrics.verticalThirds.upperThirdPct < 30
      ? 'high'
      : 'neutral';
  const defaultSides = metrics.facialIndex < 80 ? 'faded' : 'tapered';
  const defaultFringe = metrics.verticalThirds.upperThirdPct > 35 ? 'full_bangs' : 'swept';

  if (BASETEN_API_KEY) {
    try {
      const prompt = `Client Neoclassical Facial Anthropometrics:
- Morphology: ${metrics.faceShape}
- Facial Index: ${(metrics.facialIndex / 100).toFixed(2)} (Canonical: 1.35)
- Neoclassical Vertical Thirds: Forehead=${metrics.verticalThirds.upperThirdPct}%, Mid-Face=${metrics.verticalThirds.midThirdPct}%, Jaw/Chin=${metrics.verticalThirds.lowerThirdPct}%
- Audience Preference: ${body.audience || 'unisex'}
Recommend volumetric haircut compensation and return strictly valid JSON matching:
{"crown": "high"|"neutral"|"low", "sides": "tapered"|"full"|"faded", "fringe": "full_bangs"|"curtain"|"swept"|"exposed", "rationale": string, "cautions": string}`;

      const t0 = Date.now();
      const upstreamRes = await fetch(`${BASETEN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BASETEN_API_KEY}`,
        },
        body: JSON.stringify({
          model: BASETEN_MODEL,
          messages: [
            { role: 'system', content: 'You are an aesthetic biometric anthropometrist. Output valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1200,
        }),
      });

      const data = await upstreamRes.json().catch(() => null);
      if (upstreamRes.ok && data?.choices?.[0]?.message?.content) {
        const clean = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.status(200).json({
          success: true,
          source: 'live_muse_spark_open',
          model: BASETEN_MODEL,
          prescription: {
            volumeProfile: {
              crown: parsed?.crown || defaultCrown,
              lateralSides: parsed?.sides || defaultSides,
              foreheadCoverage: parsed?.fringe || defaultFringe,
            },
            rationalization: parsed?.rationale || `Calibrated for ${metrics.faceShape} face morphology.`,
            cautions: parsed?.cautions || 'Maintain regular taper intervals to preserve neoclassical balance.',
          },
          latencyMs: Date.now() - t0,
        });
      }
    } catch (err) {}
  }

  return res.status(200).json({
    success: true,
    source: 'offline_anthropometrics',
    model: 'Deterministic Cephalometric Engine',
    prescription: {
      volumeProfile: { crown: defaultCrown, lateralSides: defaultSides, foreheadCoverage: defaultFringe },
      rationalization: `Cephalometric proportions measured for ${metrics.faceShape} face (${metrics.facialIndex.toFixed(1)} index, ${metrics.verticalThirds.upperThirdPct}% upper third); balanced with ${defaultCrown} crown and ${defaultSides} profile.`,
      cautions: 'Maintain regular taper intervals to preserve neoclassical balance.',
    },
  });
};

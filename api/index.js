const BASETEN_API_KEY = process.env.BASETEN_API_KEY || '';
const BASETEN_BASE_URL = process.env.BASETEN_BASE_URL || 'https://inference.baseten.co/v1';
const BASETEN_MODEL = process.env.BASETEN_MODEL_ID || 'meta-models/muse-spark-open-1026';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Token, X-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'biometric-hair.vercel.app'}`);
  const pathname = url.pathname;

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

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

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

    return res.status(200).json({
      success: true,
      source: 'offline_anthropometrics',
      model: 'Deterministic Cephalometric Engine',
      prescription: {
        volumeProfile: { crown: defaultCrown, lateralSides: defaultSides, foreheadCoverage: defaultFringe },
        rationalization: `Cephalometric proportions measured for ${metrics.faceShape} face (${metrics.facialIndex.toFixed(1)} index, ${metrics.verticalThirds.upperThirdPct}% upper third); balanced with ${defaultCrown} crown and ${defaultSides} profile.`,
        cautions: 'Maintain regular taper intervals to preserve harmonious neoclassical balance.',
      },
    });
  }

  return res.status(404).json({ error: `Not found: ${pathname}` });
};

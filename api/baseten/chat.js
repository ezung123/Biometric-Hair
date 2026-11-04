const BASETEN_API_KEY = process.env.BASETEN_API_KEY || '';
const BASETEN_BASE_URL = process.env.BASETEN_BASE_URL || 'https://inference.baseten.co/v1';
const BASETEN_MODEL = process.env.BASETEN_MODEL_ID || 'meta-models/muse-spark-open-1026';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Token');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const messages = body.messages || [{ role: 'user', content: 'Say hello in 3 words' }];
  const maxTokens = body.max_tokens || 800;
  const temperature = body.temperature !== undefined ? body.temperature : 0;

  if (!BASETEN_API_KEY) {
    return res.status(503).json({
      success: false,
      error: 'BASETEN_API_KEY is not configured on server',
    });
  }

  try {
    const t0 = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const upstreamRes = await fetch(`${BASETEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BASETEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: BASETEN_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await upstreamRes.json().catch(() => null);
    const latencyMs = Date.now() - t0;

    if (upstreamRes.ok && data?.choices?.[0]) {
      return res.status(200).json({
        success: true,
        data,
        latencyMs,
      });
    }

    return res.status(upstreamRes.status || 500).json({
      success: false,
      error: data?.error?.message || `Upstream returned status ${upstreamRes.status}`,
      latencyMs,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Connection error to Baseten',
    });
  }
};

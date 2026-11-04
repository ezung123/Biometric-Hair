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

  const text = body.text;
  const targetLang = body.targetLang || 'ES';

  if (!text) {
    return res.status(400).json({ success: false, error: 'Missing text to translate' });
  }

  if (!BASETEN_API_KEY) {
    return res.status(200).json({
      success: true,
      translatedText: text,
      source: 'fallback_original',
    });
  }

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
            content: `You are an expert luxury salon translator. Translate the text into ${targetLang}. Return ONLY the translated string without extra explanations or punctuation.`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 600,
        temperature: 0,
      }),
    });

    const data = await upstreamRes.json().catch(() => null);
    if (upstreamRes.ok && data?.choices?.[0]?.message?.content) {
      const translated = data.choices[0].message.content.trim();
      return res.status(200).json({
        success: true,
        translatedText: translated,
        source: 'live_muse_spark_open',
      });
    }

    return res.status(200).json({
      success: true,
      translatedText: text,
      source: 'fallback_original',
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      translatedText: text,
      source: 'fallback_original',
    });
  }
};

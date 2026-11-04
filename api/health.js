module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({ status: 'ok', provider: 'Vercel Serverless Edge' });
};

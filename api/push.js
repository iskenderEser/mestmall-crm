const { get, set, cors } = require('./lib/kv');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'Subscription gerekli.' });
    const subs = await get('push:subscriptions') || [];
    const endpoint = subscription.endpoint;
    const filtered = subs.filter(s => s.endpoint !== endpoint);
    filtered.push(subscription);
    await set('push:subscriptions', filtered);
    return res.json({ ok: true });
  }

  if (req.method === 'GET') {
    const subs = await get('push:subscriptions') || [];
    return res.json(subs);
  }

  res.status(405).end();
};

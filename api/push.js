const kv = require('./lib/kv');
const { tokenKontrol } = require('./lib/auth');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  if (req.method === 'POST') {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'Subscription gerekli.' });
    const subs = await kv.get('push:subscriptions') || [];
    const filtered = subs.filter(s => s.endpoint !== subscription.endpoint);
    filtered.push(subscription);
    await kv.set('push:subscriptions', filtered);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

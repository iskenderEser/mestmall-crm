const kv = require('./lib/kv');
const { tokenKontrol } = require('./lib/auth');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  const { tip } = req.query;

  // PLAN
  if (tip === 'plan') {
    if (req.method !== 'PUT') return res.status(405).end();
    const { firmaId } = req.query;
    const firma = await kv.get(`firma:${firmaId}`);
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadı.' });
    const updated = { ...firma, plan: req.body };
    await kv.set(`firma:${firmaId}`, updated);
    return res.json(updated);
  }

  // PUSH
  if (tip === 'push') {
    if (req.method !== 'POST') return res.status(405).end();
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'Subscription gerekli.' });
    const subs = await kv.get('push:subscriptions') || [];
    const filtered = subs.filter(s => s.endpoint !== subscription.endpoint);
    filtered.push(subscription);
    await kv.set('push:subscriptions', filtered);
    return res.json({ ok: true });
  }

  res.status(400).json({ error: 'tip parametresi gerekli.' });
};

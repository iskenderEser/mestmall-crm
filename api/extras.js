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
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadi.' });
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

  // GORULDU - kullanici firmaya baktı
  if (tip === 'goruldu') {
    if (req.method !== 'POST') return res.status(405).end();
    const { firmaId } = req.query;
    if (!firmaId) return res.status(400).json({ error: 'firmaId gerekli.' });
    await kv.set(`goruldu:${user.id}:${firmaId}`, new Date().toISOString());
    return res.json({ ok: true });
  }

  // GORULDU DURUM - hangi firmalar yeni guncellendi kullaniciya gore
  if (tip === 'goruldu_durum') {
    if (req.method !== 'POST') return res.status(405).end();
    const { firmaIds } = req.body;
    if (!firmaIds || !firmaIds.length) return res.json({});
    const sonuclar = {};
    await Promise.all(firmaIds.map(async function(fid) {
      const goruldu = await kv.get(`goruldu:${user.id}:${fid}`);
      const firma = await kv.get(`firma:${fid}`);
      if (!firma) return;
      const firmaGuncelleme = firma.son_guncelleme || firma.olusturma;
      if (!goruldu || goruldu < firmaGuncelleme) {
        sonuclar[fid] = true;
      }
    }));
    return res.json(sonuclar);
  }

  res.status(400).json({ error: 'tip parametresi gerekli.' });
};

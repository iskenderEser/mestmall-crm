const kv = require('../lib/kv');
const { tokenKontrol } = require('../lib/auth');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'PUT') {
    const existing = await kv.get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadı.' });
    const updated = { ...existing, ...req.body, id };
    await kv.set(`temas:${id}`, updated);
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const existing = await kv.get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadı.' });
    await kv.del(`temas:${id}`);
    await kv.srem(`temas:firma:${existing.firma_id}`, id);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

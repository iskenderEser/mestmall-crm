const kv = require('../lib/kv');
const { tokenKontrol } = require('../lib/auth');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const firma = await kv.get(`firma:${id}`);
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadı.' });
    const temasIds = await kv.smembers(`temas:firma:${id}`);
    const temas = await Promise.all(temasIds.map(tid => kv.get(`temas:${tid}`)));
    return res.json({ ...firma, temas: temas.filter(Boolean).sort((a, b) => b.tarih.localeCompare(a.tarih)) });
  }

  if (req.method === 'PUT') {
    const firma = await kv.get(`firma:${id}`);
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadı.' });
    const updated = { ...firma, ...req.body, id };
    await kv.set(`firma:${id}`, updated);
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    if (user.rol !== 'admin') return res.status(403).json({ error: 'Sadece admin silebilir.' });
    await kv.del(`firma:${id}`);
    await kv.srem('firma:ids', id);
    const temasIds = await kv.smembers(`temas:firma:${id}`);
    await Promise.all(temasIds.map(tid => kv.del(`temas:${tid}`)));
    await kv.del(`temas:firma:${id}`);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

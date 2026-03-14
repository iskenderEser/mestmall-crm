const { get, set, del, srem, smembers, cors } = require('../lib/kv');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { id } = req.query;

  if (req.method === 'GET') {
    const firma = await get(`firma:${id}`);
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadı.' });
    const temasIds = await smembers(`temas:firma:${id}`);
    const temas = await Promise.all(temasIds.map(tid => get(`temas:${tid}`)));
    return res.json({ ...firma, temas: temas.filter(Boolean).sort((a, b) => b.tarih.localeCompare(a.tarih)) });
  }

  if (req.method === 'PUT') {
    const firma = await get(`firma:${id}`);
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadı.' });
    const updated = { ...firma, ...req.body, id };
    await set(`firma:${id}`, updated);
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    await del(`firma:${id}`);
    await srem('firma:ids', id);
    const temasIds = await smembers(`temas:firma:${id}`);
    await Promise.all(temasIds.map(tid => del(`temas:${tid}`)));
    await del(`temas:firma:${id}`);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

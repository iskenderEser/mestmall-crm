const kv = require('./lib/kv');
const { tokenKontrol } = require('./lib/auth');
const { v4: uuid } = require('uuid');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  const { firmaId, id } = req.query;

  // GET - firma temas listesi
  if (req.method === 'GET') {
    if (!firmaId) return res.status(400).json({ error: 'firmaId gerekli.' });
    const ids = await kv.smembers(`temas:firma:${firmaId}`);
    const temas = await Promise.all(ids.map(tid => kv.get(`temas:${tid}`)));
    return res.json(temas.filter(Boolean).sort((a, b) => b.tarih.localeCompare(a.tarih)));
  }

  // POST - yeni temas
  if (req.method === 'POST') {
    const { firma_id, tarih, kanal, kisi, kisi_tel, kisi_eposta, yapan_kisi, yapan_tel, yapan_eposta, ozet, sonuc } = req.body;
    if (!ozet) return res.status(400).json({ error: 'Özet zorunludur.' });
    const newId = uuid();
    const temas = {
      id: newId, firma_id, tarih, kanal,
      kisi: kisi||'', kisi_tel: kisi_tel||'', kisi_eposta: kisi_eposta||'',
      yapan_kisi: yapan_kisi||user.ad, yapan_tel: yapan_tel||'', yapan_eposta: yapan_eposta||'',
      ozet, sonuc: sonuc||'beklemede',
      olusturan_id: user.id,
      olusturma: new Date().toISOString()
    };
    await kv.set(`temas:${newId}`, temas);
    await kv.sadd(`temas:firma:${firma_id}`, newId);
    const firma = await kv.get(`firma:${firma_id}`);
    if (firma && (!firma.son_temas || tarih > firma.son_temas)) {
      await kv.set(`firma:${firma_id}`, { ...firma, son_temas: tarih });
    }
    return res.status(201).json(temas);
  }

  // PUT - temas güncelle
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id gerekli.' });
    const existing = await kv.get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadı.' });
    const updated = { ...existing, ...req.body, id };
    await kv.set(`temas:${id}`, updated);
    return res.json(updated);
  }

  // DELETE - temas sil
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id gerekli.' });
    const existing = await kv.get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadı.' });
    await kv.del(`temas:${id}`);
    await kv.srem(`temas:firma:${existing.firma_id}`, id);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

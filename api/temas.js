const kv = require('./lib/kv');
const { tokenKontrol } = require('./lib/auth');
const { v4: uuid } = require('uuid');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  if (req.method === 'GET') {
    const { firmaId } = req.query;
    if (!firmaId) return res.status(400).json({ error: 'firmaId gerekli.' });
    const ids = await kv.smembers(`temas:firma:${firmaId}`);
    const temas = await Promise.all(ids.map(id => kv.get(`temas:${id}`)));
    return res.json(temas.filter(Boolean).sort((a, b) => b.tarih.localeCompare(a.tarih)));
  }

  if (req.method === 'POST') {
    const { firma_id, tarih, kanal, kisi, kisi_tel, kisi_eposta, yapan_kisi, yapan_tel, yapan_eposta, ozet, sonuc } = req.body;
    if (!ozet) return res.status(400).json({ error: 'Özet zorunludur.' });
    const id = uuid();
    const temas = {
      id, firma_id, tarih, kanal,
      kisi: kisi||'', kisi_tel: kisi_tel||'', kisi_eposta: kisi_eposta||'',
      yapan_kisi: yapan_kisi||user.ad, yapan_tel: yapan_tel||'', yapan_eposta: yapan_eposta||'',
      ozet, sonuc: sonuc||'beklemede',
      olusturan_id: user.id,
      olusturma: new Date().toISOString()
    };
    await kv.set(`temas:${id}`, temas);
    await kv.sadd(`temas:firma:${firma_id}`, id);
    const firma = await kv.get(`firma:${firma_id}`);
    if (firma && (!firma.son_temas || tarih > firma.son_temas)) {
      await kv.set(`firma:${firma_id}`, { ...firma, son_temas: tarih });
    }
    return res.status(201).json(temas);
  }

  res.status(405).end();
};

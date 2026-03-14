const kv = require('./lib/kv');
const { tokenKontrol } = require('./lib/auth');
const { v4: uuid } = require('uuid');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  if (req.method === 'GET') {
    const ids = await kv.smembers('firma:ids');
    if (!ids.length) return res.json([]);
    const firmalar = await Promise.all(ids.map(id => kv.get(`firma:${id}`)));
    const temiz = firmalar.filter(f => f && f.ad).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    return res.json(temiz);
  }

  if (req.method === 'POST') {
    const { ad, web, telefon, eposta, referans_kisi, odak_kisi, urun_notlari, durum } = req.body;
    if (!ad) return res.status(400).json({ error: 'Firma adı zorunludur.' });
    const id = uuid();
    const firma = { id, ad, web: web||'', telefon: telefon||'', eposta: eposta||'', referans_kisi: referans_kisi||'', odak_kisi: odak_kisi||'', urun_notlari: urun_notlari||'', durum: durum||'baslanmadi', plan: null, olusturma: new Date().toISOString(), son_temas: null };
    await kv.set(`firma:${id}`, firma);
    await kv.sadd('firma:ids', id);
    return res.status(201).json(firma);
  }

  res.status(405).end();
};

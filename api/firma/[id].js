import { get, set, sadd, smembers, cors } from './lib/kv.js';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const ids = await smembers('firma:ids') || [];
    if (!ids.length) return res.json([]);
    const firmalar = await Promise.all(ids.map(id => get(`firma:${id}`)));
    const temiz = firmalar.filter(f => f && f.ad).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    return res.json(temiz);
  }

  if (req.method === 'POST') {
    const { ad, web, telefon, eposta, referans_kisi, odak_kisi, urun_notlari, durum } = req.body;
    if (!ad) return res.status(400).json({ error: 'Firma adı zorunludur.' });
    const id = uuid();
    const firma = { id, ad, web: web||'', telefon: telefon||'', eposta: eposta||'', referans_kisi: referans_kisi||'', odak_kisi: odak_kisi||'', urun_notlari: urun_notlari||'', durum: durum||'baslanmadi', plan: null, olusturma: new Date().toISOString(), son_temas: null };
    await set(`firma:${id}`, firma);
    await sadd('firma:ids', id);
    return res.status(201).json(firma);
  }

  res.status(405).end();
}

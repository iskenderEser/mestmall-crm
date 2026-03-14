import { get, set, sadd, smembers, cors } from './lib/kv.js';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { firmaId } = req.query;
    if (!firmaId) return res.status(400).json({ error: 'firmaId gerekli.' });
    const ids = await smembers(`temas:firma:${firmaId}`) || [];
    const temas = await Promise.all(ids.map(id => get(`temas:${id}`)));
    return res.json(temas.filter(Boolean).sort((a, b) => b.tarih.localeCompare(a.tarih)));
  }

  if (req.method === 'POST') {
    const { firma_id, tarih, kanal, kisi, kisi_tel, kisi_eposta, yapan_kisi, yapan_tel, yapan_eposta, ozet, sonuc } = req.body;
    if (!ozet) return res.status(400).json({ error: 'Özet zorunludur.' });
    const id = uuid();
    const temas = { id, firma_id, tarih, kanal, kisi: kisi||'', kisi_tel: kisi_tel||'', kisi_eposta: kisi_eposta||'', yapan_kisi: yapan_kisi||'', yapan_tel: yapan_tel||'', yapan_eposta: yapan_eposta||'', ozet, sonuc: sonuc||'beklemede', olusturma: new Date().toISOString() };
    await set(`temas:${id}`, temas);
    await sadd(`temas:firma:${firma_id}`, id);
    // Update son_temas on firma
    const firma = await get(`firma:${firma_id}`);
    if (firma && (!firma.son_temas || tarih > firma.son_temas)) {
      await set(`firma:${firma_id}`, { ...firma, son_temas: tarih });
    }
    return res.status(201).json(temas);
  }

  res.status(405).end();
}

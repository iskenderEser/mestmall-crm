const kv = require('./lib/kv');
const { tokenKontrol } = require('./lib/auth');
const { v4: uuid } = require('uuid');

async function sendYorumBildirimi(temas, yorumYazan, tip) {
  try {
    const subs = await kv.get('push:subscriptions') || [];
    if (subs.length && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      const webpush = require('web-push');
      webpush.setVapidDetails(
        'mailto:' + process.env.NOTIFY_EMAIL,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      const baslik = tip === 'gorus' ? 'Gorus/Oneri/Soru var' : 'Yorum/Cevap var';
      await Promise.allSettled(subs.map(sub =>
        webpush.sendNotification(sub, JSON.stringify({
          title: baslik,
          body: yorumYazan + ' yorum ekledi.',
          url: '/'
        }))
      ));
    }
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      const baslik = tip === 'gorus' ? 'Gorus/Oneri/Soru' : 'Yorum/Cevap';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'MestMall CRM <onboarding@resend.dev>',
          to: temas.yapan_eposta || process.env.NOTIFY_EMAIL,
          subject: baslik + ' — MestMall CRM',
          text: yorumYazan + ' bir temas kaydina ' + baslik + ' ekledi.\n\nMestMall CRM: ' + (process.env.APP_URL || 'https://mestmall-crm.vercel.app')
        })
      });
    }
  } catch(e) { console.log('Bildirim hatasi:', e); }
}

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = await tokenKontrol(req, res, kv);
  if (!user) return;
  const { firmaId, id, action } = req.query;

  if (req.method === 'GET') {
    if (!firmaId) return res.status(400).json({ error: 'firmaId gerekli.' });
    const ids = await kv.smembers(`temas:firma:${firmaId}`);
    const temas = await Promise.all(ids.map(tid => kv.get(`temas:${tid}`)));
    return res.json(temas.filter(Boolean).sort((a, b) => b.tarih.localeCompare(a.tarih)));
  }

  if (req.method === 'POST' && !id) {
    const { firma_id, tarih, kanal, kisi, kisi_tel, kisi_eposta, yapan_kisi, yapan_tel, yapan_eposta, ozet, sonuc, readonly } = req.body;
    if (!ozet) return res.status(400).json({ error: 'Ozet zorunludur.' });
    const newId = uuid();
    const temas = {
      id: newId, firma_id, tarih, kanal,
      kisi: kisi||'', kisi_tel: kisi_tel||'', kisi_eposta: kisi_eposta||'',
      yapan_kisi: yapan_kisi||user.ad, yapan_tel: yapan_tel||'', yapan_eposta: yapan_eposta||'',
      ozet, sonuc: sonuc||'beklemede',
      readonly: readonly || false,
      olusturan_id: user.id,
      olusturma: new Date().toISOString(),
      yorumlar: []
    };
    await kv.set(`temas:${newId}`, temas);
    await kv.sadd(`temas:firma:${firma_id}`, newId);
    const firma = await kv.get(`firma:${firma_id}`);
    if (firma && (!firma.son_temas || tarih > firma.son_temas)) {
      await kv.set(`firma:${firma_id}`, { ...firma, son_temas: tarih });
    }
    return res.status(201).json(temas);
  }

  if (req.method === 'POST' && id && action === 'yorum') {
    const existing = await kv.get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadi.' });
    const { metin, tip } = req.body;
    if (!metin) return res.status(400).json({ error: 'Metin zorunludur.' });
    if (tip === 'cevap' && existing.olusturan_id !== user.id) {
      return res.status(403).json({ error: 'Sadece ilk notu yazan cevap verebilir.' });
    }
    const yorum = {
      id: uuid(),
      tip: tip || 'gorus',
      metin,
      yazan_id: user.id,
      yazan_ad: user.ad,
      tarih: new Date().toISOString()
    };
    const yorumlar = existing.yorumlar || [];
    yorumlar.push(yorum);
    await kv.set(`temas:${id}`, { ...existing, yorumlar });
    await sendYorumBildirimi(existing, user.ad, tip);
    return res.status(201).json(yorum);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id gerekli.' });
    const existing = await kv.get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadi.' });
    const updated = { ...existing, ...req.body, id };
    await kv.set(`temas:${id}`, updated);
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id gerekli.' });
    const existing = await kv.get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadi.' });
    await kv.del(`temas:${id}`);
    await kv.srem(`temas:firma:${existing.firma_id}`, id);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

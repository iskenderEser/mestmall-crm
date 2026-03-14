const kv = require('../lib/kv');
const { hashSifre, tokenKontrol } = require('../lib/auth');

function geciciSifreUret() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const currentUser = await tokenKontrol(req, res, kv);
  if (!currentUser) return;

  const { id } = req.query;
  const hedefUser = await kv.get(`user:${id}`);
  if (!hedefUser) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  if (req.method === 'PATCH') {
    if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    const { aktif } = req.body;
    const updated = { ...hedefUser, aktif };
    await kv.set(`user:${id}`, updated);
    return res.json({ id, aktif });
  }

  if (req.method === 'PUT') {
    if (req.body.action === 'sifre_sifirla') {
      if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
      const geciciSifre = geciciSifreUret();
      const updated = { ...hedefUser, sifre_hash: hashSifre(geciciSifre), ilk_giris: true };
      await kv.set(`user:${id}`, updated);
      return res.json({ gecici_sifre: geciciSifre });
    }

    if (req.body.action === 'sifre_degistir') {
      if (currentUser.id !== id) return res.status(403).json({ error: 'Yetkisiz.' });
      const { yeni_sifre } = req.body;
      if (!yeni_sifre || yeni_sifre.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
      const updated = { ...hedefUser, sifre_hash: hashSifre(yeni_sifre), ilk_giris: false };
      await kv.set(`user:${id}`, updated);
      return res.json({ ok: true });
    }
  }

  if (req.method === 'DELETE') {
    if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    if (id === currentUser.id) return res.status(400).json({ error: 'Kendinizi silemezsiniz.' });
    await kv.del(`user:${id}`);
    await kv.srem('user:ids', id);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

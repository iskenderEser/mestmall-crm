const kv = require('./lib/kv');
const { hashSifre, jwtOlustur, tokenKontrol } = require('./lib/auth');
const { v4: uuid } = require('uuid');

function geciciSifreUret() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // LOGIN
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).end();
    const { cep_tel, sifre } = req.body;
    if (!cep_tel || !sifre) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    const temizTel = cep_tel.replace(/\s/g, '');
    const denemeKey = `login:deneme:${temizTel}`;
    const deneme = await kv.get(denemeKey) || { sayi: 0, son: 0 };
    const simdi = Date.now();
    if (deneme.sayi >= 5 && simdi - deneme.son < 15 * 60 * 1000) {
      const kalanDakika = Math.ceil((15 * 60 * 1000 - (simdi - deneme.son)) / 60000);
      return res.status(429).json({ error: `Çok fazla hatalı deneme. ${kalanDakika} dakika bekleyin.` });
    }
    const userIds = await kv.smembers('user:ids');
    const users = await Promise.all(userIds.map(id => kv.get(`user:${id}`)))
    const user = users.filter(Boolean).find(u => u.cep_tel.replace(/\D/g, '').replace(/^0/, '') === temizTel.replace(/^0/, ''));
    if (!user || user.sifre_hash !== hashSifre(sifre)) {
      await kv.set(denemeKey, { sayi: (deneme.sayi || 0) + 1, son: simdi });
      return res.status(401).json({ error: 'Cep telefonu veya şifre hatalı.' });
    }
    if (!user.aktif) return res.status(401).json({ error: 'Hesabınız devre dışı.' });
    await kv.set(denemeKey, { sayi: 0, son: 0 });
    const token = jwtOlustur(user);
    return res.json({ token, user: { id: user.id, ad: user.ad, rol: user.rol }, ilkGiris: user.ilk_giris });
  }

  // SEED - ilk admin kullanıcı
  if (action === 'seed') {
    if (req.method !== 'POST') return res.status(405).end();
    const secret = req.headers['x-seed-secret'];
    if (secret !== process.env.SEED_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    const existing = await kv.smembers('user:ids');
    if (existing.length > 0) return res.status(400).json({ error: 'Kullanıcılar zaten oluşturulmuş.' });
    const id = uuid();
    const admin = {
      id, ad: 'İskender', cep_tel: '05324333145',
      sifre_hash: hashSifre('1a2b3c4d'),
      rol: 'admin', aktif: true, ilk_giris: false,
      olusturma: new Date().toISOString()
    };
    await kv.set(`user:${id}`, admin);
    await kv.sadd('user:ids', id);
    return res.json({ ok: true, id });
  }

  // Buradan sonrası token gerektirir
  const currentUser = await tokenKontrol(req, res, kv);
  if (!currentUser) return;

  const { id } = req.query;

  // Kullanıcı listesi - GET /api/users
  if (!id && req.method === 'GET') {
    if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    const ids = await kv.smembers('user:ids');
    const users = await Promise.all(ids.map(uid => kv.get(`user:${uid}`)));
    return res.json(users.filter(Boolean).map(u => ({
      id: u.id, ad: u.ad, cep_tel: u.cep_tel, rol: u.rol, aktif: u.aktif, ilk_giris: u.ilk_giris
    })));
  }

  // Yeni kullanıcı ekle - POST /api/users
  if (!id && req.method === 'POST') {
    if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    const { ad, cep_tel, rol } = req.body;
    if (!ad || !cep_tel) return res.status(400).json({ error: 'Ad ve cep tel zorunludur.' });
    const geciciSifre = geciciSifreUret();
    const newId = uuid();
    const yeniUser = {
      id: newId, ad, cep_tel, rol: rol || 'kullanici',
      sifre_hash: hashSifre(geciciSifre),
      aktif: true, ilk_giris: true,
      olusturma: new Date().toISOString()
    };
    await kv.set(`user:${newId}`, yeniUser);
    await kv.sadd('user:ids', newId);
    return res.status(201).json({ id: newId, ad, cep_tel, rol: yeniUser.rol, gecici_sifre: geciciSifre });
  }

  // Aktif/Deaktif - PATCH /api/users?id=xxx
  if (id && req.method === 'PATCH') {
    if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    const hedef = await kv.get(`user:${id}`);
    if (!hedef) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    const updated = { ...hedef, aktif: req.body.aktif };
    await kv.set(`user:${id}`, updated);
    return res.json({ id, aktif: req.body.aktif });
  }

  // Şifre işlemleri - PUT /api/users?id=xxx
  if (id && req.method === 'PUT') {
    const hedef = await kv.get(`user:${id}`);
    if (!hedef) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    if (req.body.action === 'sifre_sifirla') {
      if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
      const geciciSifre = geciciSifreUret();
      await kv.set(`user:${id}`, { ...hedef, sifre_hash: hashSifre(geciciSifre), ilk_giris: true });
      return res.json({ gecici_sifre: geciciSifre });
    }
    if (req.body.action === 'sifre_degistir') {
      if (currentUser.id !== id) return res.status(403).json({ error: 'Yetkisiz.' });
      const { yeni_sifre } = req.body;
      if (!yeni_sifre || yeni_sifre.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
      await kv.set(`user:${id}`, { ...hedef, sifre_hash: hashSifre(yeni_sifre), ilk_giris: false });
      return res.json({ ok: true });
    }
  }

  // Kullanıcı sil - DELETE /api/users?id=xxx
  if (id && req.method === 'DELETE') {
    if (currentUser.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    if (id === currentUser.id) return res.status(400).json({ error: 'Kendinizi silemezsiniz.' });
    await kv.del(`user:${id}`);
    await kv.srem('user:ids', id);
    return res.json({ ok: true });
  }

  res.status(405).end();
};

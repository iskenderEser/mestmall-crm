const kv = require('./lib/kv');
const { hashSifre, tokenKontrol } = require('./lib/auth');
const { v4: uuid } = require('uuid');

function geciciSifreUret() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  if (req.method === 'GET') {
    if (user.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    const ids = await kv.smembers('user:ids');
    const users = await Promise.all(ids.map(id => kv.get(`user:${id}`)));
    return res.json(users.filter(Boolean).map(u => ({
      id: u.id, ad: u.ad, cep_tel: u.cep_tel, rol: u.rol, aktif: u.aktif, ilk_giris: u.ilk_giris
    })));
  }

  if (req.method === 'POST') {
    if (user.rol !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });
    const { ad, cep_tel, rol } = req.body;
    if (!ad || !cep_tel) return res.status(400).json({ error: 'Ad ve cep tel zorunludur.' });
    const geciciSifre = geciciSifreUret();
    const id = uuid();
    const yeniUser = {
      id, ad, cep_tel, rol: rol || 'kullanici',
      sifre_hash: hashSifre(geciciSifre),
      aktif: true, ilk_giris: true,
      olusturma: new Date().toISOString()
    };
    await kv.set(`user:${id}`, yeniUser);
    await kv.sadd('user:ids', id);
    return res.status(201).json({
      id, ad, cep_tel, rol: yeniUser.rol,
      gecici_sifre: geciciSifre
    });
  }

  res.status(405).end();
};

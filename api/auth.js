const kv = require('./lib/kv');
const { hashSifre, jwtOlustur } = require('./lib/auth');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
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
    const users = await Promise.all(userIds.map(id => kv.get(`user:${id}`)));
    const user = users.filter(Boolean).find(u => u.cep_tel.replace(/\s/g, '') === temizTel);

    if (!user || user.sifre_hash !== hashSifre(sifre)) {
      await kv.set(denemeKey, { sayi: (deneme.sayi || 0) + 1, son: simdi });
      return res.status(401).json({ error: 'Cep telefonu veya şifre hatalı.' });
    }

    if (!user.aktif) return res.status(401).json({ error: 'Hesabınız devre dışı.' });

    await kv.set(denemeKey, { sayi: 0, son: 0 });
    const token = jwtOlustur(user);
    return res.json({
      token,
      user: { id: user.id, ad: user.ad, rol: user.rol },
      ilkGiris: user.ilk_giris
    });
  }

  res.status(405).end();
};

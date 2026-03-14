const kv = require('./lib/kv');
const { hashSifre } = require('./lib/auth');
const { v4: uuid } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = req.headers['x-seed-secret'];
  if (secret !== process.env.SEED_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const existing = await kv.smembers('user:ids');
  if (existing.length > 0) return res.status(400).json({ error: 'Kullanıcılar zaten oluşturulmuş.' });

  const id = uuid();
  const admin = {
    id,
    ad: 'İskender',
    cep_tel: '05324333145',
    sifre_hash: hashSifre('1a2b3c4d'),
    rol: 'admin',
    aktif: true,
    ilk_giris: false,
    olusturma: new Date().toISOString()
  };
  await kv.set(`user:${id}`, admin);
  await kv.sadd('user:ids', id);
  return res.json({ ok: true, id });
};

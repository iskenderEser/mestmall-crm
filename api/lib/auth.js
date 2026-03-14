const crypto = require('crypto');

function hashSifre(sifre) {
  return crypto.createHash('sha256').update(sifre + process.env.AUTH_SECRET).digest('hex');
}

function jwtOlustur(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    ad: user.ad,
    cep_tel: user.cep_tel,
    rol: user.rol,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  })).toString('base64url');
  const imza = crypto.createHmac('sha256', process.env.AUTH_SECRET)
    .update(header + '.' + payload).digest('base64url');
  return `${header}.${payload}.${imza}`;
}

function jwtDogrula(token) {
  try {
    const [header, payload, imza] = token.split('.');
    const beklenenImza = crypto.createHmac('sha256', process.env.AUTH_SECRET)
      .update(header + '.' + payload).digest('base64url');
    if (imza !== beklenenImza) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch { return null; }
}

async function tokenKontrol(req, res, kv) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Giriş gerekli.' });
    return null;
  }
  const token = authHeader.split(' ')[1];
  const user = jwtDogrula(token);
  if (!user) {
    res.status(401).json({ error: 'Oturum süresi dolmuş. Tekrar giriş yapın.' });
    return null;
  }
  const dbUser = await kv.get(`user:${user.id}`);
  if (!dbUser || !dbUser.aktif) {
    res.status(401).json({ error: 'Hesabınız devre dışı.' });
    return null;
  }
  return user;
}

module.exports = { hashSifre, jwtOlustur, jwtDogrula, tokenKontrol };

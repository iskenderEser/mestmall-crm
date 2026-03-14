const kv = require('./lib/kv');
const { tokenKontrol } = require('./lib/auth');

module.exports = async function handler(req, res) {
  kv.cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await tokenKontrol(req, res, kv);
  if (!user) return;

  if (req.method === 'PUT') {
    const { firmaId } = req.query;
    const firma = await kv.get(`firma:${firmaId}`);
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadı.' });
    const updated = { ...firma, plan: req.body };
    await kv.set(`firma:${firmaId}`, updated);
    return res.json(updated);
  }

  res.status(405).end();
};

import { get, set, cors } from './lib/kv.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'PUT') {
    const { firmaId } = req.query;
    const firma = await get(`firma:${firmaId}`);
    if (!firma) return res.status(404).json({ error: 'Firma bulunamadı.' });
    const updated = { ...firma, plan: req.body };
    await set(`firma:${firmaId}`, updated);
    return res.json(updated);
  }

  res.status(405).end();
}

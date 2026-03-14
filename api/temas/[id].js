import { get, set, del, srem, cors } from '../lib/kv.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const existing = await get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadı.' });
    const updated = { ...existing, ...req.body, id };
    await set(`temas:${id}`, updated);
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const existing = await get(`temas:${id}`);
    if (!existing) return res.status(404).json({ error: 'Temas bulunamadı.' });
    await del(`temas:${id}`);
    await srem(`temas:firma:${existing.firma_id}`, id);
    return res.json({ ok: true });
  }

  res.status(405).end();
}

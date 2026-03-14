import { get, smembers } from '../lib/kv.js';

export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  // Get all firmalar
  const ids = await smembers('firma:ids') || [];
  const firmalar = await Promise.all(ids.map(id => get(`firma:${id}`)));

  // Filter firmalar with plan due today or overdue
  const dueFirmalar = firmalar.filter(f => f && f.plan && f.plan.tarih && f.plan.tarih <= today);

  if (!dueFirmalar.length) return res.json({ sent: 0 });

  const firmaList = dueFirmalar.map(f => `• ${f.ad} — ${f.plan.tarih}${f.plan.kisi ? ' (' + f.plan.kisi + ')' : ''}`).join('\n');
  const count = dueFirmalar.length;

  // Send push notifications
  const subs = await get('push:subscriptions') || [];
  const webpush = await import('web-push');
  webpush.setVapidDetails(
    'mailto:' + process.env.NOTIFY_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const pushResults = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(sub, JSON.stringify({
        title: `📅 ${count} planlı iletişim var`,
        body: dueFirmalar.slice(0, 3).map(f => f.ad).join(', ') + (count > 3 ? ` ve ${count - 3} firma daha` : ''),
        url: '/'
      }))
    )
  );

  // Send email via Resend
  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MestMall CRM <onboarding@resend.dev>',
        to: process.env.NOTIFY_EMAIL,
        subject: `📅 Bugün ${count} planlı iletişim — MestMall CRM`,
        text: `Merhaba,\n\nBugün iletişime geçmeniz gereken firmalar:\n\n${firmaList}\n\nMestMall CRM'e gitmek için: ${process.env.APP_URL || 'https://mestmall-crm.vercel.app'}`
      })
    });
  }

  return res.json({ sent: count, push: pushResults.filter(r => r.status === 'fulfilled').length });
}

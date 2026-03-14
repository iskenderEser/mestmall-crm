# MestMall CRM

## Kurulum

### 1. Vercel Environment Variables
Vercel Dashboard → Settings → Environment Variables'a şunları ekleyin:

```
KV_REST_API_URL=https://known-jay-71422.upstash.io
KV_REST_API_TOKEN=gQAAAAAAARb-...
KV_REST_API_READ_ONLY_TOKEN=ggAAAAAAARb-...
RESEND_API_KEY=re_...        (Resend.com'dan alın)
NOTIFY_EMAIL=siz@email.com   (Bildirim gidecek e-posta)
CRON_SECRET=rastgele-gizli-bir-string
SEED_SECRET=rastgele-gizli-bir-string
APP_URL=https://mestmall-crm.vercel.app
VAPID_PUBLIC_KEY=...         (web-push ile üretin)
VAPID_PRIVATE_KEY=...        (web-push ile üretin)
```

### 2. VAPID Key üretme (Push Notification için)
```bash
npx web-push generate-vapid-keys
```
Çıkan PUBLIC ve PRIVATE key'leri yukarıdaki değişkenlere ekleyin.

### 3. Mevcut firma verilerini içe aktarma (Tek seferlik)
Deploy sonrası:
```bash
curl -X POST https://mestmall-crm.vercel.app/api/seed \
  -H "x-seed-secret: SEED_SECRET_DEGERINIZ"
```

### 4. Deploy
GitHub'a push yapınca Vercel otomatik deploy eder.

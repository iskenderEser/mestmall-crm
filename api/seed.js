import { get, set, sadd, smembers } from './lib/kv.js';
import { v4 as uuid } from 'uuid';

const SEED = [
  {ad:'Abbvie',web:'abbvie.com',telefon:'',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Botox, HarmonyCa, Juvederm',durum:'baslanmadi'},
  {ad:'ATT Medikal',web:'www.att.com.tr',telefon:'444 06 25',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Cihaz',durum:'baslanmadi'},
  {ad:'Bellamono',web:'www.bellamono.com',telefon:'542 269 20 67',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'',durum:'olumsuz'},
  {ad:'Biotech',web:'www.biotechhealthcare.com.tr',telefon:'',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:"TR bağlantısı yok, İsviçre'ye mesaj atılıyor",durum:'iletisimde'},
  {ad:'Bolat Medikal',web:'bolatmedikal.com',telefon:'0212 424 19 75',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'',durum:'iletisimde'},
  {ad:'Burgeon',web:'burgeon.me',telefon:'0312 405 80 69',eposta:'',referans_kisi:'',odak_kisi:'Aylin Hanım (Pazarlama)',urun_notlari:'Kendi web satış kanalları var. Kayıt çok başarılı',durum:'olumlu'},
  {ad:'DFL',web:'dfl.com.tr',telefon:'0312 495 06 40',eposta:'',referans_kisi:'',odak_kisi:'Sertaç Bahar (Genel Md.)',urun_notlari:'Skinfill dolgu ürünleri',durum:'olumsuz'},
  {ad:'Dosa Medikal',web:'dosamedikal.com',telefon:'0212 812 66 68',eposta:'dosamedikal@gmail.com',referans_kisi:'',odak_kisi:'Mehmet Bey',urun_notlari:'Mezoterapi ürünleri',durum:'beklemede'},
  {ad:'Elasty (MEDICALINE)',web:'elastyturkiye.com',telefon:'0212 238 73 50',eposta:'',referans_kisi:'',odak_kisi:'Halil Kara (Marka Müd.)',urun_notlari:'',durum:'beklemede'},
  {ad:'Erdağı Medikal',web:'erdagimedikal.com',telefon:'0533 342 24 53',eposta:'info@erdagimedikal.com',referans_kisi:'',odak_kisi:'Gökberk Bey',urun_notlari:'',durum:'beklemede'},
  {ad:'Estetik Dermal',web:'estetikdermal.com',telefon:'0256 612 18 13',eposta:'',referans_kisi:'',odak_kisi:'Özge Hanım',urun_notlari:"RRS-HA ve 6 farklı marka, Aydın firması",durum:'iletisimde'},
  {ad:'Gen İlaç',web:'genilac.com.tr',telefon:'0532 287 07 19',eposta:'',referans_kisi:'',odak_kisi:'Erkan Erzi (Ticaret Müd.)',urun_notlari:'Dysport',durum:'iletisimde'},
  {ad:'Genotek',web:'genotekpharma.com',telefon:'0312 514 83 10',eposta:'Hakan.sahin@genotekpharma.com',referans_kisi:'',odak_kisi:'Hakan Şahin (Dijital Paz.)',urun_notlari:'Jalupro',durum:'iletisimde'},
  {ad:'Koçyiğit Medikal',web:'kocyigitmedikal.com.tr',telefon:'0216 574 39 61',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Çeşitli cihazlar',durum:'baslanmadi'},
  {ad:'Lagoom Medikal',web:'lagoom.com.tr',telefon:'0216 472 13 14',eposta:'mustafa.karagozlu@lagoom.com.tr',referans_kisi:'',odak_kisi:'Mustafa Karagözlü (Owner)',urun_notlari:'Aquashine ve birçok ürün',durum:'beklemede'},
  {ad:'Live Pharma',web:'livepharma.com.tr',telefon:'0212 319 18 22',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Nucleofill ve birçok ürün',durum:'olumsuz'},
  {ad:'Magic Medikal',web:'magicmedikal.com',telefon:'0532 419 23 26',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'3 çeşit dolgu ve kanül',durum:'baslanmadi'},
  {ad:'Mezoklinik',web:'mezoklinik.com.tr',telefon:'0212 438 40 20',eposta:'',referans_kisi:'',odak_kisi:'Alp Bey',urun_notlari:'Verimli görüşme, çok ilgilendi',durum:'iletisimde'},
  {ad:'Naturamed BMS',web:'naturamedbms.net',telefon:'0312 473 77 14',eposta:'',referans_kisi:'',odak_kisi:'Çağan Elgün (Owner)',urun_notlari:'Innea Aqua',durum:'beklemede'},
  {ad:'Nebs Pharma',web:'nebs.com.tr',telefon:'0212 465 60 65',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'NCTF ve Fillmed distribütörü',durum:'olumsuz'},
  {ad:'Neva Farma',web:'nevafarma.com',telefon:'0535 717 74 75',eposta:'',referans_kisi:'',odak_kisi:'Ebru Gökçen',urun_notlari:'Neauvia Türkiye satıcısı',durum:'iletisimde'},
  {ad:'Nortechpharma',web:'nortechpharma.com',telefon:'0552 732 06 15',eposta:'',referans_kisi:'Kendim',odak_kisi:'Emel Özgen (Marka Müd.) / Oral Kızılşık (Owner)',urun_notlari:'Mezoterapi ürünleri',durum:'beklemede'},
  {ad:'Nurederm',web:'nurederm.com',telefon:'0850 255 15 90',eposta:'info@nurederm.com',referans_kisi:'Kudret / Dr. Ayşegül',odak_kisi:'',urun_notlari:'Çoklu ürünler, kendi sipariş web ve app',durum:'iletisimde'},
  {ad:'Ortadoğu Medikal',web:'ortadoguas.com',telefon:'0212 277 90 90',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Cihaz satıyorlar',durum:'baslanmadi'},
  {ad:'Östafarma Medical',web:'ostafarma.com',telefon:'0216 629 75 64',eposta:'',referans_kisi:'',odak_kisi:'Ali İhsan Ateş (Şirket Sahibi)',urun_notlari:'Çeşitli ürünler, ihracat yapıyorlar',durum:'iletisimde'},
  {ad:'Rebe Medikal',web:'rebemedikal.com',telefon:'0505 153 10 92',eposta:'',referans_kisi:'',odak_kisi:'Mustafa Bey (Sahibi)',urun_notlari:'Sarf malzeme ve çoklu ürün',durum:'olumlu'},
  {ad:'Reganyal',web:'regenyaltr.com',telefon:'0530 604 28 17',eposta:'',referans_kisi:'',odak_kisi:'Taylan Altuncuoğlu',urun_notlari:'',durum:'iletisimde'},
  {ad:'Renée Türkiye',web:'reneeturkiye.com',telefon:'0312 285 64 66',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'',durum:'olumsuz'},
  {ad:'Revoderm',web:'revodermpharma.com',telefon:'0535 105 94 04',eposta:'',referans_kisi:'',odak_kisi:'Gökhan Yavuz (Owner)',urun_notlari:'İki ürünleri var',durum:'beklemede'},
  {ad:'Sanomed',web:'sanomed.com.tr',telefon:'',eposta:'',referans_kisi:'',odak_kisi:'Mehmet Ayık / Ali Biçken',urun_notlari:'Birçok ürün',durum:'iletisimde'},
  {ad:'Seltek',web:'seltekgroup.com',telefon:'0216 680 34 44',eposta:'reha.zorlu@seltekgroup.com',referans_kisi:'',odak_kisi:'Reha Zorlu (Dijital İşler)',urun_notlari:'Çoklu ürünler, kendi sipariş web var',durum:'iletisimde'},
  {ad:'STR Medikal',web:'strmedical.com',telefon:'0532 600 98 34',eposta:'m.abay@strmedical.com',referans_kisi:'',odak_kisi:'Meryem Abay',urun_notlari:'Çeşitli ürünler, Çorum merkezli ihracat',durum:'beklemede'},
  {ad:'Trifarma',web:'trifarma.com.tr',telefon:'0212 876 33 98',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Birçok ürün',durum:'iletisimde'},
  {ad:'FacePharma',web:'facepharma.com.tr',telefon:'0232 234 24 94',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Dolgu ve mezoterapi',durum:'baslanmadi'},
  {ad:'Unimaster',web:'unimaster.com.tr',telefon:'0552 140 04 48',eposta:'',referans_kisi:'',odak_kisi:'Kübra Hanım',urun_notlari:'Dolgu ürünleri',durum:'olumlu'},
  {ad:'Serkan Demir',web:'',telefon:'0537 864 71 20',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Firma adı öğrenilemedi',durum:'beklemede'},
  {ad:'Estetik Pharma',web:'estetikpharma.com',telefon:'',eposta:'',referans_kisi:'',odak_kisi:'Mutlu Begde (Sahibi)',urun_notlari:'',durum:'olumsuz'},
  {ad:'deyPharma',web:'divesmedtr.com',telefon:'0506 649 63 63',eposta:'',referans_kisi:'',odak_kisi:'Tuğba Hanım',urun_notlari:'',durum:'iletisimde'},
  {ad:'DS Pharma',web:'',telefon:'',eposta:'',referans_kisi:'',odak_kisi:'Çetin Bey (Şirket Sahibi)',urun_notlari:'Eski Metspharma mümessili',durum:'beklemede'},
  {ad:'Helvacıoğlu Medikal',web:'medikaliste.com',telefon:'444 21 32',eposta:'',referans_kisi:'',odak_kisi:'Mert Bey (Satış Müd.)',urun_notlari:'',durum:'beklemede'},
  {ad:'ASM Medikal Market',web:'asmmedikalmarket.com',telefon:'0532 317 97 60',eposta:'',referans_kisi:'',odak_kisi:'Gökhan Bey',urun_notlari:'Medikal sarf malzemeler',durum:'iletisimde'},
  {ad:'Worldist Pharma',web:'worldistpharma.com.tr',telefon:'0532 770 00 80',eposta:'',referans_kisi:'',odak_kisi:'Murat Aksan (Owner)',urun_notlari:'',durum:'beklemede'},
  {ad:'Demokozmetik',web:'',telefon:'0501 251 36 00',eposta:'',referans_kisi:'',odak_kisi:'Çiğdem Özad',urun_notlari:'8 SKU, medikal estetik doktorlara satış',durum:'olumlu'},
  {ad:'Iconic Medical Cosmetics',web:'iconicmedicalcosmetics.com',telefon:'0212 287 00 90',eposta:'info@iconicmedicalcosmetics.com',referans_kisi:'',odak_kisi:'Sait Cevher Tatar (Yönetici)',urun_notlari:'',durum:'iletisimde'},
  {ad:'Heimest',web:'heimest.com.tr',telefon:'0507 142 43 46',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'',durum:'baslanmadi'},
  {ad:'Mayaform Medikal',web:'mayaformmedikal.com.tr',telefon:'0312 472 04 33',eposta:'hakan@mayaformmedikal.com',referans_kisi:'',odak_kisi:'Hakan Bey',urun_notlari:'',durum:'iletisimde'},
  {ad:'Biyostem',web:'biyostem.com',telefon:'0532 260 27 05',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'',durum:'baslanmadi'},
  {ad:'Metspharma',web:'',telefon:'',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Ürün girişi yapılacak',durum:'baslanmadi'},
  {ad:'Hybrexo',web:'',telefon:'',eposta:'',referans_kisi:'',odak_kisi:'',urun_notlari:'Ürün girişi yapılacak',durum:'baslanmadi'}
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = req.headers['x-seed-secret'];
  if (secret !== process.env.SEED_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const existing = await smembers('firma:ids') || [];
  if (existing.length > 0) return res.status(400).json({ error: 'Zaten seed edilmiş. Tekrar çalıştırmak için KV\'yi temizleyin.' });

  for (const s of SEED) {
    const id = uuid();
    const firma = { id, ...s, plan: null, olusturma: new Date().toISOString(), son_temas: null };
    await set(`firma:${id}`, firma);
    await sadd('firma:ids', id);
  }

  return res.json({ ok: true, count: SEED.length });
}

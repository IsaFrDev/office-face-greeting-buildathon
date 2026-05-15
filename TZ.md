# TEXNIK TOPSHIRIQ (TZ)

# Buildathon Loyihasi

## Ofis uchun Yuzni Tanish va Salomlashish Tizimi

Format: Solo  |  Davomiyligi: 1 kun

## 1. Umumiy Tavsif

Buildathon ishtirokchisi ofis kirish eshigi oldida o'rnatilgan kamera va monitor uchun mo'ljallangan tizimni ishlab chiqishi kerak. Tizim odatda monitorda promo va boshqa videolarni uzluksiz aylantirib turadi. Kameraga bazadagi tanish odam tushganda, video ustida shaxsiy salomlashuv xabari paydo bo'ladi:

```text
Xush kelibsiz, [Ism]!
```

Xabar bir necha soniya ko'rsatilgandan keyin yo'qoladi va video davom etaveradi. Bazada bo'lmagan odamlarga tizim reaksiya bildirmaydi - videolar buzilmasdan o'ynashda davom etadi.

## 2. Foydalanish Konteksti

Ofis kirish joyiga kamerali monitor o'rnatiladi. Monitorning asosiy vazifasi - vizual brending va promo materiallarini ko'rsatish. Yuzni tanish funksiyasi qo'shimcha qatlam sifatida ishlaydi:

- Default holat: monitor uzluksiz video pleylistini aylantiradi.
- Tanish odam aniqlanganda: video ustida salomlashuv overlay'i paydo bo'ladi, bir necha soniyadan keyin yo'qoladi.
- Notanish odam aniqlanganda: hech qanday reaksiya yo'q, videolar o'ynashda davom etadi.

## 3. Funksional Talablar

### 3.1 Video Pleyer (asosiy oqim)

- Tizim ishga tushganda mahalliy papkadagi videolarni avtomatik o'ynay boshlaydi.
- Videolar pleylist tartibida ketma-ket o'ynaydi va oxiriga yetganda boshidan qaytadan boshlanadi (loop).
- Video to'liq ekran (fullscreen) rejimida bo'ladi.
- Ofis xodimi pleylistga osongina video qo'sha olishi yoki olib tashlay olishi kerak (oddiy papkaga fayl tashlash yoki UI orqali).
- Tavsiya etiladigan formatlar: MP4 (H.264).

### 3.2 Yuzni Aniqlash va Tanish (parallel oqim)

- Kameradan real vaqt rejimida video oqimini olish (video pleyerga xalaqit bermasdan, alohida thread/process'da).
- Kadrdagi yuzlarni aniqlash va bazadagi yuzlar bilan solishtirish.
- Faqat baza bilan mos kelgan holatda salomlashuv overlay'ini chiqarish.
- Bazada bo'lmagan odamlar uchun hech qanday harakat qilinmaydi - video buzilmasdan davom etadi.
- Kadrda bir nechta tanish odam bo'lganda mantiqiy tanlov (eng yaqindagi, eng katta yuz, yoki birinchi aniqlangan - ishtirokchi tanlaydi va hujjatlashtiradi).
- Bir odamni qisqa vaqt ichida qayta-qayta salomlamaslik (masalan, 60 soniyalik "cooldown").

### 3.3 Salomlashuv Overlay'i

- Video ustida ko'rinadigan matn qatlami - videoni to'xtatmaydi, faqat ustiga chiqadi.
- Toza, katta shriftli, yaxshi o'qiladigan dizayn.
- Silliq paydo bo'lish va yo'qolish animatsiyasi (fade-in / fade-out).
- Ekranda 4-6 soniya ko'rsatilib, keyin avtomatik yo'qoladi.
- Ko'rsatish vaqtida video pleyer pauzaga olinmaydi.

### 3.4 Ma'lumotlar Bazasi Boshqaruvi

Bazada saqlanishi kerak: odamning ismi va yuz tasviri (yoki yuz embedding'i).

Oddiy interfeys (web UI afzal, lekin desktop yoki CLI ham qabul qilinadi) orqali:

- Yangi odamni qo'shish (ism kiritish va rasm yuklash).
- Odamni o'chirish.
- Bazadagi odamlar ro'yxatini ko'rish.
- Qo'shimcha imkoniyat: kamera orqali to'g'ridan-to'g'ri yangi odamning yuzini olib, bazaga qo'shish.

## 4. Texnik Talablar

- Tizim oddiy noutbuk yoki mini-PC + USB kamera orqali ishlashi kerak.
- Video pleyer va yuzni tanish bir vaqtning o'zida sekin ishlamasligi kerak - multithreading yoki asynchronous arxitektura tavsiya etiladi.
- Yuzni tanish kechikishi: yuz kadrga tushgandan overlay chiqquncha - 2 soniyadan oshmasligi maqsadga muvofiq.
- Oddiy ofis yorug'ligida ishlashi kerak.
- Kod ochiq Git repozitoriyasida bo'lishi shart, README.md fayli bilan.
- Dasturlash tili va kutubxonalar erkin tanlanadi (masalan: Python + OpenCV + face_recognition / DeepFace, JS + Electron + face-api.js va boshqalar).

## 5. Nofunksional Talablar

- Maxfiylik: Yuz ma'lumotlari faqat lokal qurilmada saqlanadi, uchinchi tomon xizmatlariga yuborilmaydi.
- Barqarorlik: Tizim bir necha soat uzluksiz ishlashi kerak, video oqimi to'xtamasligi va crash bo'lmasligi lozim.
- Qulaylik: Texnik bo'lmagan ofis xodimi yordamsiz yangi odamni va yangi videoni qo'sha olishi kerak.

## 6. Topshiriladigan Materiallar

- Git repozitoriyasidagi ishlovchi kod (GitHub yoki shunga o'xshash platforma).
- README.md - o'rnatish va ishga tushirish bo'yicha aniq ko'rsatmalar bilan.
- Qisqa demo video (1-3 daqiqa):
  - Tizim ishga tushishi va videolar o'ynay boshlashi.
  - Bazaga yangi odam qo'shish.
  - Shu odam kamera oldidan o'tib, video ustida salomlashuv overlay'ini olishi.
  - Bazada yo'q odam kameraga tushganda - videolar buzilmasdan davom etishi.
- Qisqa texnik hujjat - arxitektura, ishlatilgan kutubxonalar va qarorlar haqida.

## 7. Baholash Mezonlari

| Mezon | Vazn |
| --- | ---: |
| Yuzni tanish aniqligi | 20% |
| Video pleyer va overlay sifati (silliqlik, dizayn) | 20% |
| Tezlik va reaksiya vaqti | 15% |
| Baza va video boshqaruvi UX | 15% |
| Tizim barqarorligi (parallel oqimlar) | 10% |
| Kod sifati va hujjatlash | 10% |
| Ijodkorlik / qo'shimcha imkoniyatlar | 10% |

## 8. Qo'shimcha (Bonus) Imkoniyatlar

- Salomlashuv kun vaqtiga qarab o'zgarishi ("Xayrli tong, [Ism]", "Xayrli kun, [Ism]", "Xayrli kech, [Ism]").
- Uch tilda salomlashuv (O'zbek / Ingliz / Rus) - har bir odam uchun til tanlash imkoni.
- Har bir odam uchun maxsus shaxsiy xabar (masalan, tug'ilgan kunda alohida salomlashuv).
- Kirgan tanish odamlarni log qilish (kim, qachon kirdi).
- Boshqaruv panelida login/parol himoyasi.
- Telegram yoki Slack orqali bildirishnoma yuborish.
- Pleylistga belgilangan vaqtga qarab boshqacha videolar qo'yish (masalan, ertalab boshqa, kunduzi boshqa).

## 9. Vaqt va Topshirish Tartibi

- Format: Solo (yakka)
- Davomiyligi: 1 kun (hackathon formati)
- Boshlanishi: [sana va vaqt]
- Yakuniy topshirish: [sana va vaqt]
- Taqdimot: har bir ishtirokchi o'z loyihasini sudyalarga demo qilib ko'rsatadi.

## 10. Texnik Maslahatlar (Ishtirokchilar uchun)

- 1 kunlik vaqt cheklovini hisobga olib, ikkita asosiy modulni alohida boshlang: (1) video pleyer + overlay, (2) yuzni tanish. Keyin ularni birlashtiring.
- MVP yondashuvi: avval video uzluksiz aylansin -> keyin yuzni tanish qo'shing -> keyin baza UI -> keyin bonus imkoniyatlar.
- Yuzni tanish va video pleyer bir thread'da ishlamasligi kerak - aks holda video "lag" qiladi. threading, multiprocessing yoki async yondashuvni rejalashtiring.
- Ma'lumotlar bazasi sifatida murakkab SQL kerak emas - JSON fayl, SQLite yoki pickle yetarli.
- Yuz embedding'larini oldindan hisoblab saqlash tavsiya etiladi (har safar rasmni qayta ishlamaslik uchun) - bu tezlikni sezilarli oshiradi.
- Overlay uchun web texnologiyalar (HTML + CSS animatsiyalari Electron'da, yoki Pygame, yoki PyQt) ishlatish - fade animatsiyalarini osonlashtiradi.
